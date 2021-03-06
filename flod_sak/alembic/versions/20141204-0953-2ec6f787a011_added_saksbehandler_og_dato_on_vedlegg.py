"""added_saksbehandler_og_dato_on_vedlegg

Revision ID: 2ec6f787a011
Revises: 3767cae04c82
Create Date: 2014-12-04 09:53:19.900728

"""

# revision identifiers, used by Alembic.
revision = '2ec6f787a011'
down_revision = '3c0eefef4acb'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('vedlegg', sa.Column('saksbehandler_id', sa.String(), nullable=True))
    op.add_column('vedlegg', sa.Column('vedlagtdato', sa.Date(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('vedlegg', 'vedlagtdato')
    op.drop_column('vedlegg', 'saksbehandler_id')
    ### end Alembic commands ###
