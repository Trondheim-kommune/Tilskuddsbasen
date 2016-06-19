"""lagt_husk_ogsa_paa_tilskuddsordning

Revision ID: 33a3cac025a0
Revises: 13024367e00d
Create Date: 2016-02-11 20:23:47.269529

"""

# revision identifiers, used by Alembic.
revision = '33a3cac025a0'
down_revision = '140475cd6c7'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tilskuddsordninger', sa.Column('husk_ogsa', sa.String(length=1000), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('tilskuddsordninger', 'husk_ogsa')
    ### end Alembic commands ###